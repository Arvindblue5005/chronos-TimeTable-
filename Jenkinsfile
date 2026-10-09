pipeline {
    agent any

    environment {
        APP_NAME = 'chronos-timetable'
        IMAGE_NAME = "chronos-timetable:${BUILD_NUMBER}"
        IMAGE_LATEST = 'chronos-timetable:latest'
        CONTAINER_TEST_NAME = "chronos-test-${BUILD_NUMBER}"
        TEST_PORT = '3001'
        PROD_PORT = '3000'
    }

    options {
        timeout(time: 20, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '15', artifactNumToKeepStr: '15'))
        disableConcurrentBuilds()
        ansiColor('xterm')
    }

    stages {
        stage('Environment Check') {
            steps {
                echo "=== Chronos CI/CD Pipeline - Build #${BUILD_NUMBER} ==="
                sh 'node --version || echo "Node not in host PATH, using Docker"'
                sh 'docker --version'
                sh 'docker compose version || docker-compose --version'
            }
        }

        stage('Install & Lint Code') {
            steps {
                echo 'Validating codebase and checking TypeScript types...'
                sh '''
                    # Install dependencies and execute strict type validation
                    if command -v npm >/dev/null 2>&1; then
                        npm install
                        npm run lint
                    else
                        docker run --rm -v $(pwd):/app -w /app node:22-alpine sh -c "npm install && npm run lint"
                    fi
                '''
            }
        }

        stage('Build Application') {
            steps {
                echo 'Building production Vite bundle and static assets...'
                sh '''
                    if command -v npm >/dev/null 2>&1; then
                        npm run build
                    else
                        docker run --rm -v $(pwd):/app -w /app node:22-alpine sh -c "npm run build"
                    fi
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building multi-stage Docker image: ${IMAGE_NAME}..."
                sh """
                    docker build \
                        --build-arg BUILD_NUMBER=${BUILD_NUMBER} \
                        -t ${IMAGE_NAME} \
                        -t ${IMAGE_LATEST} \
                        -f Dockerfile .
                """
            }
        }

        stage('Container Smoke Test & Health Check') {
            steps {
                echo 'Starting test container and validating healthcheck API endpoint...'
                sh """
                    # Run container in test mode
                    docker run -d \
                        --name ${CONTAINER_TEST_NAME} \
                        -p ${TEST_PORT}:3000 \
                        -e NODE_ENV=production \
                        ${IMAGE_NAME}

                    # Wait for container startup
                    sleep 5

                    # Verify healthcheck endpoint returns HTTP 200
                    STATUS=\$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${TEST_PORT}/api/health || echo "FAILED")
                    echo "Smoke test health check status: \${STATUS}"

                    if [ "\${STATUS}" != "200" ]; then
                        echo "Healthcheck failed with response code \${STATUS}"
                        docker logs ${CONTAINER_TEST_NAME}
                        exit 1
                    fi

                    echo "Smoke test passed successfully: /api/health returned 200 OK"
                """
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                echo "Deploying ${APP_NAME} to production runtime using Docker Compose..."
                sh '''
                    # Deploy service via docker compose
                    docker compose down || true
                    docker compose up -d --remove-orphans
                    
                    echo "Chronos Timetable container successfully deployed and listening on port 3000"
                '''
            }
        }
    }

    post {
        always {
            echo 'Cleaning up test containers and workspace...'
            sh """
                docker rm -f ${CONTAINER_TEST_NAME} 2>/dev/null || true
            """
        }
        success {
            echo "SUCCESS: Chronos Timetable build #${BUILD_NUMBER} completed and verified!"
        }
        failure {
            echo "ERROR: Pipeline execution failed on build #${BUILD_NUMBER}. Check logs above for details."
        }
    }
}
