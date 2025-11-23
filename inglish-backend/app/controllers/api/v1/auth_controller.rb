module Api
  module V1
    class AuthController < BaseController
      skip_before_action :authenticate_user!

      # GET /api/v1/auth/me
      # Get current authenticated user
      def me
        token = extract_token_from_header
        user = JwtService.current_user(token)

        if user
          render_success(
            data: {
              user: UserSerializer.new(user).as_json
            },
            message: "Authenticated"
          )
        else
          render_error(
            message: "Invalid or expired token",
            status: :unauthorized
          )
        end
      end

      private

      def extract_token_from_header
        auth_header = request.headers['Authorization']
        return nil unless auth_header

        token = auth_header.split(' ').last
        token.presence
      end

      def json_request?
        request.format.json?
      end
    end
  end
end




