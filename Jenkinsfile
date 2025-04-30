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
                withCredentials([usernamePassword(credentialsId: 'DockerHubCredentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                    sh 'docker build -t $DOCKER_USER/nodejs-goof .'
                    sh 'docker push $DOCKER_USER/nodejs-goof'
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
                    sh '''
                        ssh -i ${keyfile} -o StrictHostKeyChecking=no rosari@172.20.10.2 "
                            echo il0v3ayang | docker login -u rosari1629 --password-stdin &&
                            docker rm -f nodejsgoof || true &&
                            docker pull rosari1629/nodejs-goof &&
                            docker run -it --detach -p 3001:3001 --name nodejsgoof --network host rosari1629/nodejs-goof
                        "
                    '''
                }
            }
        }

        stage('DAST Scan using OWASP ZAP') {
            agent {
                docker {
                    image 'ghcr.io/zaproxy/zaproxy:stable'
                    args '--network host'
                }
            }
            steps {
                sh '''
                    mkdir -p zap-report
                    zap-baseline.py -t http://localhost:3001 -r zap-report/report.html -I || true

                    echo "==> Menampilkan isi direktori zap-report:"
                    ls -lh zap-report

                    echo "==> Cuplikan isi report.html:"
                    head -n 20 zap-report/report.html || echo "report.html tidak ditemukan"
                '''
            }
        }

        stage('Copy and Archive Report') {
            steps {
                echo 'Menyalin dan mengarsip report.html dari direktori zap-report'
                sh 'cp zap-report/report.html . || echo "Gagal menyalin report.html"'
                archiveArtifacts artifacts: 'report.html', allowEmptyArchive: true
            }
        }

        stage('Email Report') {
            steps {
                emailext(
                    subject: "Laporan CI/CD Pipeline (ZAP Scan)",
                    body: "Berikut adalah hasil pipeline dan DAST scan OWASP ZAP.<br><br>Silakan lihat lampiran.",
                    to: 'rosaridalige36@gmail.com',
                    attachmentsPattern: 'report.html',
                    mimeType: 'text/html'
                )
            }
        }
    }
}
