module Api
  module V1
    class HealthController < BaseController
      skip_before_action :authenticate_user!
      
      # GET /api/v1/health
      def index
        render_success(
          data: HealthSerializer.new(nil).as_json,
          message: "API is healthy",
          status: :ok
        )
      end
    end
  end
end

