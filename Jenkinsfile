pipeline {
    agent any

    environment {
        // Nx에서 변경 사항을 비교할 대상 브랜치 (기본값: main)
        NX_BASE = "${env.GIT_PREVIOUS_SUCCESSFUL_COMMIT ?: 'main'}"
        NX_HEAD = "${env.GIT_COMMIT}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Lint Affected') {
            steps {
                sh "npx nx affected -t lint --base=${NX_BASE} --head=${NX_HEAD}"
            }
        }

        stage('Test Affected') {
            steps {
                sh "npx nx affected -t test --base=${NX_BASE} --head=${NX_HEAD}"
            }
        }

        stage('Build Affected') {
            steps {
                // 변경된 프로젝트만 빌드 수행
                sh "npx nx affected -t build --base=${NX_BASE} --head=${NX_HEAD}"
            }
        }

        stage('Docker Image Build (Affected)') {
            steps {
                script {
                    // 변경된 프로젝트 목록을 가져와서 각각 도커 이미지 빌드
                    def affectedProjects = sh(
                        script: "npx nx show projects --affected --base=${NX_BASE} --head=${NX_HEAD}",
                        returnStdout: true
                    ).trim().split('\\s+')

                    for (project in affectedProjects) {
                        if (project) {
                            echo "Building Docker Image for: ${project}"
                            // 각 프로젝트 폴더의 Dockerfile을 사용하여 빌드
                            sh "docker build -t meta-${project}:latest -f ${project}/Dockerfile ."
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Please check the logs.'
        }
    }
}
