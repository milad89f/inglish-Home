require 'rails_helper'

RSpec.configure do |config|
  # Specify a root folder where Swagger JSON files are generated
  # NOTE: If you're using the rswag-api to serve API descriptions, you'll need
  # to ensure that it's configured to serve Swagger from the same folder
  config.openapi_root = Rails.root.join('swagger').to_s

  # Define one or more Swagger documents and provide global metadata for each one
  # When you run the 'rswag:specs:swaggerize' rake task, the complete Swagger will
  # be generated at the provided relative path under openapi_root
  # NOTE: If you're using the rswag-api middleware between your API and client
  # (like in a Rails API-only app), you'll need to ensure that it's configured
  # to serve Swagger JSON files from the same folder
  config.openapi_specs = {
    'v1/swagger.yaml' => {
      openapi: '3.0.1',
      info: {
        title: 'Inglish Backend API V1',
        version: 'v1',
        description: 'This is the Inglish Backend API documentation. All course-related endpoints require JWT authentication. Some endpoints require premium membership.'
      },
      servers: [
        {
          url: 'http://localhost:3001',
          description: 'Development server'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: :http,
            scheme: :bearer,
            bearerFormat: 'JWT',
            description: 'JWT authentication token'
          }
        },
        schemas: {
          User: {
            type: :object,
            properties: {
              id: { type: :integer },
              email: { type: :string },
              name: { type: :string },
              language: { type: :string, enum: ['en', 'tr'] },
              membership: { type: :string, enum: ['free', 'premium'], example: 'free' },
              created_at: { type: :string, format: 'date-time' },
              updated_at: { type: :string, format: 'date-time' }
            }
          },
          Course: {
            type: :object,
            properties: {
              id: { type: :integer },
              title: { type: :string },
              description: { type: :string },
              language: { type: :string, enum: ['en', 'tr'] },
              level: { type: :string, enum: ['beginner', 'intermediate', 'advanced'] },
              is_published: { type: :boolean },
              user_id: { type: :integer },
              created_at: { type: :string, format: 'date-time' },
              updated_at: { type: :string, format: 'date-time' }
            }
          },
          Video: {
            type: :object,
            properties: {
              id: { type: :integer },
              text: { type: :string },
              language: { type: :string },
              remote_video_url: { type: :string },
              video_type: { type: :string, enum: ['normal', 'idle', 'success', 'retry'] },
              position: { type: :integer },
              user_id: { type: :integer },
              course_id: { type: :integer },
              subject_id: { type: :integer },
              created_at: { type: :string, format: 'date-time' },
              updated_at: { type: :string, format: 'date-time' }
            }
          },
          Report: {
            type: :object,
            properties: {
              id: { type: :integer },
              accuracy: { type: :number, format: :float },
              reference_text: { type: :string },
              transcribed_text: { type: :string },
              incorrect_words: { type: :array },
              word_details: { type: :array },
              audio_duration: { type: :integer },
              user_id: { type: :integer },
              video_id: { type: :integer },
              course_id: { type: :integer },
              created_at: { type: :string, format: 'date-time' },
              updated_at: { type: :string, format: 'date-time' }
            }
          },
          Subject: {
            type: :object,
            properties: {
              id: { type: :integer },
              name: { type: :string },
              description: { type: :string },
              language: { type: :string },
              difficulty: { type: :integer, enum: [1, 2, 3] },
              difficulty_label: { type: :string },
              position: { type: :integer },
              course_id: { type: :integer },
              created_at: { type: :string, format: 'date-time' },
              updated_at: { type: :string, format: 'date-time' }
            }
          },
          Error: {
            type: :object,
            properties: {
              success: { type: :boolean, example: false },
              message: { type: :string },
              errors: { type: :object }
            }
          },
          SuccessResponse: {
            type: :object,
            properties: {
              success: { type: :boolean, example: true },
              message: { type: :string },
              data: { type: :object }
            }
          },
          AuthResponse: {
            type: :object,
            properties: {
              success: { type: :boolean, example: true },
              message: { type: :string },
              data: {
                type: :object,
                properties: {
                  user: { '$ref' => '#/components/schemas/User' },
                  token: { type: :string },
                  expires_at: { type: :string, format: 'date-time' }
                }
              }
            }
          },
          LlmAnalysisResponse: {
            type: :object,
            properties: {
              success: { type: :boolean, example: true },
              message: { type: :string },
              data: {
                type: :object,
                properties: {
                  analysis_text: { type: :string },
                  generated_at: { type: :string, format: 'date-time' },
                  user_id: { type: :integer }
                }
              }
            }
          },
          LlmReportResponse: {
            type: :object,
            properties: {
              success: { type: :boolean, example: true },
              message: { type: :string },
              data: {
                type: :object,
                properties: {
                  report_text: { type: :string },
                  generated_at: { type: :string, format: 'date-time' },
                  user_id: { type: :integer },
                  course_id: { type: :integer }
                }
              }
            }
          },
          LlmSubjectResponse: {
            type: :object,
            properties: {
              success: { type: :boolean, example: true },
              message: { type: :string },
              data: {
                type: :object,
                properties: {
                  subject_name: { type: :string },
                  subject_content: { type: :string },
                  difficulty: { type: :integer },
                  language: { type: :string },
                  generated_at: { type: :string, format: 'date-time' },
                  course_id: { type: :integer }
                }
              }
            }
          }
        }
      },
      paths: {}
    }
  }

  # Specify the format of the output Swagger file when running 'rswag:specs:swaggerize'.
  # The swagger_docs configuration option has the filename including format in
  # the key, this may want to be changed to avoid putting yaml in json files.
  # Defaults to json. Accepts ':json' and ':yaml'.
  config.openapi_format = :yaml
end




