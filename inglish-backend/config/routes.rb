Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Swagger/OpenAPI Documentation
  mount Rswag::Ui::Engine => '/api-docs' if defined?(Rswag::Ui::Engine)
  mount Rswag::Api::Engine => '/api-docs' if defined?(Rswag::Api::Engine)

  # API Routes
  namespace :api do
    namespace :v1 do
      get "health", to: "health#index"

      # Authentication endpoints (public)
      post "users/signup", to: "users#signup"
      post "users/login", to: "users#login"
      get "auth/me", to: "auth#me"

      # User endpoints (protected)
      get "users/:id/courses", to: "users#courses"
      put "users/:id/upgrade", to: "users#upgrade"
      put "users/:id/change_password", to: "users#change_password"

      # Course endpoints (protected)
      resources :courses, only: [:create, :show] do
        member do
          get :videos
          get :reports
          get :subjects
          put :set_active
        end
        
        # Nested resources for videos and reports
        resources :videos, only: [:create], controller: 'videos'
        resources :videos, only: [] do
          resources :reports, only: [:create], controller: 'reports'
        end
      end
      
      # Video endpoints (protected)
      resources :videos, only: [:show, :update, :destroy]
      
      # Report endpoints (protected)
      resources :reports, only: [:show]

      # LLM endpoints (protected - premium only)
      post "llm/analysis", to: "llm#generate_analysis"
      post "llm/report", to: "llm#generate_report"
      post "llm/subject", to: "llm#generate_subject"
      post "llm/sentences", to: "llm#generate_sentences"
    end
  end

  # Defines the root path route ("/")
  # root "posts#index"
end
