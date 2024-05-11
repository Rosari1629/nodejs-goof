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
                sh 'npm run test'
            }
        }
        stage('SAST SonarQube') {
            agent {
              docker {
                  image 'sonarsource/sonar-scanner-cli:latest'
                  args '--network host -v ".:/usr/src" --entrypoint='
              }
            }
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                    sh 'sonar-scanner -Dsonar.projectKey=nodejs-goof -Dsonar.qualitygate.wait=true -Dsonar.sources=. -Dsonar.host.url=http://192.168.236.223:9000 -Dsonar.token=sqp_b18d55ccf63ef9597da25e87e9f7f8f291a0131f' 
                }
            }
        }
        stage('Build Docker Image') {
            agent {
                docker {
                    image 'docker:dind'
                    args '--user root --network host -v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
            steps {
                sh 'docker build -t nodejs-goof:0.1 .'
            }
        }
   }
}
