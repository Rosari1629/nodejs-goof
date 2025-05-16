pipeline {
    agent none

    environment {
        SNYK_CREDENTIALS = credentials('SnykToken')
        APP_NAME = 'goof'
        ZAP_REPORT_DIR = '/home/rosari/ZAP-REPORT'
        ZAP_REPORT_HTML = "report_goof.html"
        ZAP_REPORT_XML  = "report_goof.xml"
        ZAP_REPORT_JSON = "report_goof.json"
        ZAP_IMAGE = 'ghcr.io/zaproxy/zaproxy:stable'
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
                sh 'npm test || echo "Test selesai dengan peringatan."'
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
                            docker network create goofnet || true &&
                            echo il0v3ayang | docker login -u rosari1629 --password-stdin &&
                            docker rm -f nodejsgoof || true &&
                            docker run -d --name nodejsgoof --network goofnet -p 3001:3001 rosari1629/nodejs-goof
                        "
                    '''
                    // Health check aplikasi siap menerima request
                    timeout(time: 60, unit: 'SECONDS') {
                        waitUntil {
                            script {
                                def status = sh (
                                    script: "ssh -i ${keyfile} -o StrictHostKeyChecking=no rosari@172.20.10.2 'curl -s -o /dev/null -w \"%{http_code}\" http://localhost:3001 || echo ERR'",
                                    returnStdout: true
                                ).trim()
                                echo "Health check HTTP status: ${status}"
                                return (status == '200')
                            }
                        }
                    }
                }
            }
        }

        stage('DAST Scan using OWASP ZAP') {
            agent any
            steps {
                script {
                    withEnv(["TARGET=http://nodejsgoof:3001"]) {
                        sh '''
                            echo "Starting ZAP scan..."
                            docker run --rm \
                                --network goofnet \
                                -v /home/rosari/ZAP-REPORT:/zap/wrk \
                                ghcr.io/zaproxy/zaproxy:stable \
                                zap-baseline.py \
                                -t $TARGET \
                                -r /zap/wrk/report_goof.html \
                                -x /zap/wrk/report_goof.xml \
                                -J /zap/wrk/report_goof.json \
                                -I || echo "ZAP scan failed"
                        '''
                    }
                }
            }
        }

        stage('Report Scanning and Email') {
            agent any
            steps {
                script {
                    sh "cp /home/rosari/ZAP-REPORT/report_goof.json . || echo 'JSON report not found'"
                    sh "cp /home/rosari/ZAP-REPORT/report_goof.html . || echo 'HTML report not found'"
                    sh "cp /home/rosari/ZAP-REPORT/report_goof.xml . || echo 'XML report not found'"
                    sh "ls -lh report* || echo 'Tidak ada file laporan ditemukan'"

                    def attachments = []
                    if (fileExists("report_goof.json")) attachments << "report_goof.json"
                    if (fileExists("report_goof.html")) attachments << "report_goof.html"
                    if (fileExists("report_goof.xml")) attachments << "report_goof.xml"

                    emailext (
                        subject: "ZAP Report - GOOF",
                        body: "Terlampir hasil scan aplikasi Node.js GOOF.<br>Silakan cek lampiran.",
                        attachmentsPattern: attachments.join(', '),
                        to: 'rosaridalige36@gmail.com',
                        attachLog: true,
                        mimeType: 'text/html'
                    )
                }
            }
        }
    }

    post {
        success {
            script {
                node {
                    publishHTML(target: [
                        reportDir: '.',
                        reportFiles: 'report_goof.html',
                        reportName: 'ZAP Security Report - GOOF',
                        keepAll: true,
                        allowMissing: true,
                        alwaysLinkToLastBuild: true
                    ])
                }
            }
        }
    }
}
