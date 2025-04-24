pipeline {
    agent none

    environment {
        SNYK_CREDENTIALS = credentials('SnykToken')
    }

    stages {
        stage('Secret Scanning Using Trufflehog') {
            agent {
                docker {
                    image 'trufflesecurity/trufflehog:latest'
                    args '-u root --entrypoint='
                }
            }
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                    sh 'trufflehog filesystem . --only-verified --exclude-paths trufflehog-excluded-paths.txt --fail > trufflehog-scan-result.txt'
                }
                sh 'cat trufflehog-scan-result.txt'
                archiveArtifacts artifacts: 'trufflehog-scan-result.txt'
            }
        }

        stage('Build') {
            agent {
                docker {
                    image 'node:lts-buster-slim'
                }
            }
            steps {
                sh 'npm install'
            }
        }

        stage('Test') {
            agent {
                docker {
                    image 'node:lts-buster-slim'
                }
            }
            steps {
                sh 'echo test'
            }
        }

        stage('Build Docker Image and Push to Docker Registry') {
            agent {
                docker {
                    image 'docker:dind'
                    args '--user root --network host -v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
   steps {
    withCredentials([
        sshUserPrivateKey(credentialsId: "DeploymentSSHKey", keyFileVariable: 'keyfile'),
        usernamePassword(credentialsId: 'DockerHubCredentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')
    ]) {
        sh 'echo "Using keyfile at: ${keyfile}"'
        sh 'ls -l ${keyfile}'
        sh 'ssh -i ${keyfile} -o StrictHostKeyChecking=no rosari@192.168.1.39 "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"'
        sh 'ssh -i ${keyfile} -o StrictHostKeyChecking=no rosari@192.168.1.39 "docker pull $DOCKER_USER/nodejs-goof"'
        sh 'ssh -i ${keyfile} -o StrictHostKeyChecking=no rosari@192.168.1.39 "docker run -it --detach -p 3001:3001 --name nodejsgoof --network host $DOCKER_USER/nodejs-goof"'
    }
}

            }
        }

        stage('Deploy Docker Image') {
            agent {
                docker {
                    image 'kroniak/ssh-client'
                    args '--user root --network host'
                }
            }
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: "DeploymentSSHKey", keyFileVariable: 'keyfile')]) {
                    sh 'ssh -i ${keyfile} -o StrictHostKeyChecking=no rosari@192.168.1.39 "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"'
                    sh 'ssh -i ${keyfile} -o StrictHostKeyChecking=no rosari@192.168.1.39 docker pull $DOCKER_USER/nodejs-goof'
                    sh 'ssh -i ${keyfile} -o StrictHostKeyChecking=no rosari@192.168.1.39 docker run -it --detach -p 3001:3001 --name nodejsgoof --network host $DOCKER_USER/nodejsgoof'
                }
            }
        }

        stage('DAST Scan using OWASP ZAP') {
            agent {
                docker {
                    image 'ghcr.io/zaproxy/zaproxy:stable '
                    args '--network host'
                }
            }
            steps {
                sh '''
                    zap-baseline.py -t http://localhost:8090 -g gen.conf -r zap-report.html || true
                '''
                archiveArtifacts artifacts: 'zap-report.html', allowEmptyArchive: true
            }
        }
    }
}
