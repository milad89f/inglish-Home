require 'swagger_helper'

RSpec.describe 'Inglish Backend API', type: :request do
  path '/api/v1/health' do
    get 'Health check' do
      tags 'Health'
      description 'Check API health status'
      produces 'application/json'

      response '200', 'API is healthy' do
        schema type: :object,
          properties: {
            success: { type: :boolean, example: true },
            message: { type: :string, example: 'API is healthy' },
            data: {
              type: :object,
              properties: {
                status: { type: :string, example: 'ok' },
                message: { type: :string },
                timestamp: { type: :string, format: 'date-time' },
                version: { type: :string }
              }
            }
          }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['success']).to eq(true)
        end
      end
    end
  end

  path '/api/v1/users/signup' do
    post 'Sign up' do
      tags 'Authentication'
      description 'Create a new user account'
      consumes 'application/json'
      produces 'application/json'
      
      parameter name: :user, in: :body, schema: {
        type: :object,
        properties: {
          user: {
            type: :object,
            properties: {
              email: { type: :string, example: 'user@example.com' },
              password: { type: :string, example: 'password123' },
              password_confirmation: { type: :string, example: 'password123' },
              name: { type: :string, example: 'John Doe' },
              language: { type: :string, enum: ['en', 'tr'], example: 'en' }
            },
            required: ['email', 'password', 'password_confirmation', 'name']
          }
        }
      }

      response '201', 'User created' do
        schema '$ref' => '#/components/schemas/AuthResponse'
        
        let(:user) do
          {
            user: {
              email: 'test@example.com',
              password: 'password123',
              password_confirmation: 'password123',
              name: 'Test User',
              language: 'en'
            }
          }
        end

        run_test!
      end

      response '422', 'Validation error' do
        schema '$ref' => '#/components/schemas/Error'
        
        let(:user) do
          {
            user: {
              email: '',
              password: '123',
              name: ''
            }
          }
        end

        run_test!
      end
    end
  end

  path '/api/v1/users/login' do
    post 'Login' do
      tags 'Authentication'
      description 'Authenticate user and receive JWT token'
      consumes 'application/json'
      produces 'application/json'
      
      parameter name: :user, in: :body, schema: {
        type: :object,
        properties: {
          user: {
            type: :object,
            properties: {
              email: { type: :string, example: 'user@example.com' },
              password: { type: :string, example: 'password123' }
            },
            required: ['email', 'password']
          }
        }
      }

      response '200', 'Login successful' do
        schema '$ref' => '#/components/schemas/AuthResponse'
        
        let!(:user) { User.create!(email: 'test@example.com', password: 'password123', password_confirmation: 'password123', name: 'Test', language: 'en') }
        let(:user_params) do
          {
            user: {
              email: 'test@example.com',
              password: 'password123'
            }
          }
        end

        run_test!
      end

      response '401', 'Invalid credentials' do
        schema '$ref' => '#/components/schemas/Error'
        
        let(:user_params) do
          {
            user: {
              email: 'wrong@example.com',
              password: 'wrongpassword'
            }
          }
        end

        run_test!
      end
    end
  end

  path '/api/v1/auth/me' do
    get 'Verify token' do
      tags 'Authentication'
      description 'Verify JWT token and get current user'
      produces 'application/json'
      security [bearerAuth: []]

      response '200', 'Token valid' do
        schema type: :object,
          properties: {
            success: { type: :boolean },
            message: { type: :string },
            data: {
              type: :object,
              properties: {
                user: { '$ref' => '#/components/schemas/User' }
              }
            }
          }

        let(:user) { User.create!(email: 'test@example.com', password: 'password123', password_confirmation: 'password123', name: 'Test', language: 'en') }
        let(:token) { JwtService.token_for(user) }
        let(:Authorization) { "Bearer #{token}" }

        run_test!
      end

      response '401', 'Invalid token' do
        schema '$ref' => '#/components/schemas/Error'
        let(:Authorization) { 'Bearer invalid_token' }

        run_test!
      end
    end
  end

  path '/api/v1/users/{id}/courses' do
    get 'Get user courses' do
      tags 'Users'
      description 'Get all courses for a specific user'
      produces 'application/json'
      security [bearerAuth: []]
      
      parameter name: :id, in: :path, type: :integer, required: true, description: 'User ID'

      response '200', 'Courses retrieved' do
        schema type: :object,
          properties: {
            success: { type: :boolean },
            data: {
              type: :array,
              items: { '$ref' => '#/components/schemas/Course' }
            }
          }

        let(:user) { User.create!(email: 'test@example.com', password: 'password123', password_confirmation: 'password123', name: 'Test', language: 'en') }
        let(:token) { JwtService.token_for(user) }
        let(:Authorization) { "Bearer #{token}" }
        let(:id) { user.id }
        let!(:course) { Course.create!(title: 'Test Course', language: 'en', user: user) }

        run_test!
      end

      response '403', 'Forbidden' do
        schema '$ref' => '#/components/schemas/Error'
        let(:user1) { User.create!(email: 'user1@example.com', password: 'password123', password_confirmation: 'password123', name: 'User1', language: 'en') }
        let(:user2) { User.create!(email: 'user2@example.com', password: 'password123', password_confirmation: 'password123', name: 'User2', language: 'en') }
        let(:token) { JwtService.token_for(user1) }
        let(:Authorization) { "Bearer #{token}" }
        let(:id) { user2.id }

        run_test!
      end
    end
  end

  path '/api/v1/courses' do
    post 'Create course' do
      tags 'Courses'
      description 'Create a new course (requires premium membership)'
      consumes 'application/json'
      produces 'application/json'
      security [bearerAuth: []]
      
      parameter name: :course, in: :body, schema: {
        type: :object,
        properties: {
          course: {
            type: :object,
            properties: {
              title: { type: :string, example: 'English Basics' },
              description: { type: :string, example: 'Learn basic English' },
              language: { type: :string, enum: ['en', 'tr'], example: 'en' },
              level: { type: :string, enum: ['beginner', 'intermediate', 'advanced'], example: 'beginner' },
              is_published: { type: :boolean, example: false }
            },
            required: ['title', 'language']
          }
        }
      }

      response '201', 'Course created' do
        schema type: :object,
          properties: {
            success: { type: :boolean },
            message: { type: :string },
            data: { '$ref' => '#/components/schemas/Course' }
          }

        let(:user) { User.create!(email: 'test@example.com', password: 'password123', password_confirmation: 'password123', name: 'Test', language: 'en', membership: 'premium') }
        let(:token) { JwtService.token_for(user) }
        let(:Authorization) { "Bearer #{token}" }
        let(:course) do
          {
            course: {
              title: 'English Basics',
              description: 'Learn basic English',
              language: 'en',
              level: 'beginner'
            }
          }
        end

        run_test!
      end

      response '403', 'Premium membership required' do
        schema '$ref' => '#/components/schemas/Error'
        let(:user) { User.create!(email: 'test@example.com', password: 'password123', password_confirmation: 'password123', name: 'Test', language: 'en', membership: 'free') }
        let(:token) { JwtService.token_for(user) }
        let(:Authorization) { "Bearer #{token}" }
        let(:course) do
          {
            course: {
              title: 'English Basics',
              description: 'Learn basic English',
              language: 'en',
              level: 'beginner'
            }
          }
        end

        run_test!
      end

      response '422', 'Validation error' do
        schema '$ref' => '#/components/schemas/Error'
        let(:user) { User.create!(email: 'test@example.com', password: 'password123', password_confirmation: 'password123', name: 'Test', language: 'en') }
        let(:token) { JwtService.token_for(user) }
        let(:Authorization) { "Bearer #{token}" }
        let(:course) { { course: { title: '' } } }

        run_test!
      end
    end
  end

  path '/api/v1/courses/{id}' do
    get 'Get course' do
      tags 'Courses'
      description 'Get a specific course with user and subjects'
      produces 'application/json'
      security [bearerAuth: []]
      
      parameter name: :id, in: :path, type: :integer, required: true, description: 'Course ID'

      response '200', 'Course retrieved' do
        schema type: :object,
          properties: {
            success: { type: :boolean },
            data: { '$ref' => '#/components/schemas/Course' }
          }

        let(:user) { User.create!(email: 'test@example.com', password: 'password123', password_confirmation: 'password123', name: 'Test', language: 'en') }
        let(:token) { JwtService.token_for(user) }
        let(:Authorization) { "Bearer #{token}" }
        let(:course) { Course.create!(title: 'Test Course', language: 'en', user: user) }
        let(:id) { course.id }

        run_test!
      end

      response '404', 'Course not found' do
        schema '$ref' => '#/components/schemas/Error'
        let(:user) { User.create!(email: 'test@example.com', password: 'password123', password_confirmation: 'password123', name: 'Test', language: 'en') }
        let(:token) { JwtService.token_for(user) }
        let(:Authorization) { "Bearer #{token}" }
        let(:id) { 99999 }

        run_test!
      end
    end
  end

  path '/api/v1/courses/{id}/videos' do
    get 'Get course videos' do
      tags 'Courses'
      description 'Get all videos for a specific course'
      produces 'application/json'
      security [bearerAuth: []]
      
      parameter name: :id, in: :path, type: :integer, required: true, description: 'Course ID'

      response '200', 'Videos retrieved' do
        schema type: :object,
          properties: {
            success: { type: :boolean },
            data: {
              type: :array,
              items: { '$ref' => '#/components/schemas/Video' }
            }
          }

        let(:user) { User.create!(email: 'test@example.com', password: 'password123', password_confirmation: 'password123', name: 'Test', language: 'en') }
        let(:token) { JwtService.token_for(user) }
        let(:Authorization) { "Bearer #{token}" }
        let(:course) { Course.create!(title: 'Test Course', language: 'en', user: user) }
        let(:id) { course.id }
        let!(:video) { Video.create!(text: 'Hello', language: 'en', remote_video_url: 'http://example.com/video.mp4', user: user, course: course) }

        run_test!
      end
    end
  end

  path '/api/v1/courses/{id}/reports' do
    get 'Get course reports' do
      tags 'Courses'
      description 'Get all reports for a specific course'
      produces 'application/json'
      security [bearerAuth: []]
      
      parameter name: :id, in: :path, type: :integer, required: true, description: 'Course ID'

      response '200', 'Reports retrieved' do
        schema type: :object,
          properties: {
            success: { type: :boolean },
            data: {
              type: :array,
              items: { '$ref' => '#/components/schemas/Report' }
            }
          }

        let(:user) { User.create!(email: 'test@example.com', password: 'password123', password_confirmation: 'password123', name: 'Test', language: 'en') }
        let(:token) { JwtService.token_for(user) }
        let(:Authorization) { "Bearer #{token}" }
        let(:course) { Course.create!(title: 'Test Course', language: 'en', user: user) }
        let(:video) { Video.create!(text: 'Hello', language: 'en', remote_video_url: 'http://example.com/video.mp4', user: user, course: course) }
        let(:id) { course.id }
        let!(:report) { Report.create!(accuracy: 85.5, reference_text: 'Hello', user: user, video: video, course: course) }

        run_test!
      end
    end
  end

  path '/api/v1/courses/{id}/subjects' do
    get 'Get course subjects' do
      tags 'Courses'
      description 'Get all subjects for a specific course'
      produces 'application/json'
      security [bearerAuth: []]
      
      parameter name: :id, in: :path, type: :integer, required: true, description: 'Course ID'

      response '200', 'Subjects retrieved' do
        schema type: :object,
          properties: {
            success: { type: :boolean },
            data: {
              type: :array,
              items: { '$ref' => '#/components/schemas/Subject' }
            }
          }

        let(:user) { User.create!(email: 'test@example.com', password: 'password123', password_confirmation: 'password123', name: 'Test', language: 'en') }
        let(:token) { JwtService.token_for(user) }
        let(:Authorization) { "Bearer #{token}" }
        let(:course) { Course.create!(title: 'Test Course', language: 'en', user: user) }
        let(:id) { course.id }
        let!(:subject) { Subject.create!(name: 'Greetings', language: 'en', difficulty: 1, course: course) }

        run_test!
      end
    end
  end

  path '/api/v1/llm/analysis' do
    post 'Generate analysis' do
      tags 'LLM'
      description 'Generate AI-powered analysis for user performance (requires premium membership)'
      consumes 'application/json'
      produces 'application/json'
      security [bearerAuth: []]
      
      parameter name: :report_data, in: :body, schema: {
        type: :object,
        properties: {
          report_data: {
            type: :object,
            properties: {
              total_sessions: { type: :integer, example: 15 },
              avg_accuracy: { type: :number, format: :float, example: 85.5 },
              improvement_rate: { type: :number, format: :float, example: 12.3 }
            }
          }
        }
      }

      response '200', 'Analysis generated' do
        schema '$ref' => '#/components/schemas/LlmAnalysisResponse'
        
        let(:user) { User.create!(email: 'test@example.com', password: 'password123', password_confirmation: 'password123', name: 'Test', language: 'en', membership: 'premium') }
        let(:token) { JwtService.token_for(user) }
        let(:Authorization) { "Bearer #{token}" }
        let(:report_data) { { report_data: {} } }

        run_test!
      end

      response '403', 'Premium membership required' do
        schema '$ref' => '#/components/schemas/Error'
        let(:user) { User.create!(email: 'test@example.com', password: 'password123', password_confirmation: 'password123', name: 'Test', language: 'en', membership: 'free') }
        let(:token) { JwtService.token_for(user) }
        let(:Authorization) { "Bearer #{token}" }
        let(:report_data) { { report_data: {} } }

        run_test!
      end
    end
  end

  path '/api/v1/llm/report' do
    post 'Generate report' do
      tags 'LLM'
      description 'Generate AI-powered detailed learning report (requires premium membership)'
      consumes 'application/json'
      produces 'application/json'
      security [bearerAuth: []]
      
      parameter name: :llm, in: :body, schema: {
        type: :object,
        properties: {
          llm: {
            type: :object,
            properties: {
              course_id: { type: :integer, example: 1 },
              performance_metrics: {
                type: :object,
                properties: {
                  total_sessions: { type: :integer, example: 15 },
                  avg_accuracy: { type: :number, format: :float, example: 85.5 },
                  improvement_rate: { type: :number, format: :float, example: 12.3 }
                }
              }
            },
            required: ['course_id']
          }
        }
      }

      response '200', 'Report generated' do
        schema '$ref' => '#/components/schemas/LlmReportResponse'
        
        let(:user) { User.create!(email: 'test@example.com', password: 'password123', password_confirmation: 'password123', name: 'Test', language: 'en', membership: 'premium') }
        let(:token) { JwtService.token_for(user) }
        let(:Authorization) { "Bearer #{token}" }
        let(:course) { Course.create!(title: 'Test Course', language: 'en', user: user) }
        let(:llm) { { llm: { course_id: course.id, performance_metrics: {} } } }

        run_test!
      end

      response '403', 'Premium membership required' do
        schema '$ref' => '#/components/schemas/Error'
        let(:user) { User.create!(email: 'test@example.com', password: 'password123', password_confirmation: 'password123', name: 'Test', language: 'en', membership: 'free') }
        let(:token) { JwtService.token_for(user) }
        let(:Authorization) { "Bearer #{token}" }
        let(:course) { Course.create!(title: 'Test Course', language: 'en', user: user) }
        let(:llm) { { llm: { course_id: course.id, performance_metrics: {} } } }

        run_test!
      end
    end
  end

  path '/api/v1/llm/subject' do
    post 'Generate subject' do
      tags 'LLM'
      description 'Generate AI-powered subject content (requires premium membership)'
      consumes 'application/json'
      produces 'application/json'
      security [bearerAuth: []]
      
      parameter name: :llm, in: :body, schema: {
        type: :object,
        properties: {
          llm: {
            type: :object,
            properties: {
              course_id: { type: :integer, example: 1 },
              name: { type: :string, example: 'Advanced Grammar Structures' },
              difficulty: { type: :integer, enum: [1, 2, 3], example: 2 },
              language: { type: :string, enum: ['en', 'tr'], example: 'en' }
            },
            required: ['course_id']
          }
        }
      }

      response '200', 'Subject generated' do
        schema '$ref' => '#/components/schemas/LlmSubjectResponse'
        
        let(:user) { User.create!(email: 'test@example.com', password: 'password123', password_confirmation: 'password123', name: 'Test', language: 'en', membership: 'premium') }
        let(:token) { JwtService.token_for(user) }
        let(:Authorization) { "Bearer #{token}" }
        let(:course) { Course.create!(title: 'Test Course', language: 'en', user: user) }
        let(:llm) { { llm: { course_id: course.id, name: 'Advanced Grammar', difficulty: 2, language: 'en' } } }

        run_test!
      end

      response '403', 'Premium membership required' do
        schema '$ref' => '#/components/schemas/Error'
        let(:user) { User.create!(email: 'test@example.com', password: 'password123', password_confirmation: 'password123', name: 'Test', language: 'en', membership: 'free') }
        let(:token) { JwtService.token_for(user) }
        let(:Authorization) { "Bearer #{token}" }
        let(:course) { Course.create!(title: 'Test Course', language: 'en', user: user) }
        let(:llm) { { llm: { course_id: course.id, name: 'Advanced Grammar', difficulty: 2, language: 'en' } } }

        run_test!
      end
    end
  end
end




