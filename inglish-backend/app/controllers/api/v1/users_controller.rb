module Api
  module V1
    class UsersController < BaseController
      skip_before_action :authenticate_user!, only: [:signup, :login]

      # POST /api/v1/users/signup
      def signup
        result = SignupService.call(user_params)

        if result.success?
          user = result.data
          token = JwtService.token_for(user)
          
          render_success(
            data: {
              user: UserSerializer.new(user).as_json,
              token: token,
              expires_at: 24.hours.from_now.iso8601
            },
            message: result.message,
            status: :created
          )
        else
          render_error(
            message: result.message,
            errors: result.errors,
            status: :unprocessable_entity
          )
        end
      end

      # POST /api/v1/users/login
      def login
        result = AuthenticationService.call(
          email: login_params[:email],
          password: login_params[:password]
        )

        if result.success?
          user = result.data
          token = JwtService.token_for(user)
          
          render_success(
            data: {
              user: UserSerializer.new(user).as_json,
              token: token,
              expires_at: 24.hours.from_now.iso8601
            },
            message: result.message
          )
        else
          render_error(
            message: result.message,
            status: :unauthorized
          )
        end
      end

      # GET /api/v1/users/:id/courses
      # Protected endpoint - requires authentication
      def courses
        user = User.find(params[:id])
        
        # Ensure users can only access their own courses
        unless user.id == current_user.id
          render_error(
            message: "Unauthorized. You can only access your own courses.",
            status: :forbidden
          )
          return
        end
        
        # Order by active first, then by creation date
        courses = user.courses.ordered

        render_success(
          data: serialize_collection(courses, serializer: CourseSerializer)
        )
      rescue ActiveRecord::RecordNotFound
        render_error(
          message: "User not found",
          status: :not_found
        )
      end

      # PUT /api/v1/users/:id/upgrade
      # Protected endpoint - requires authentication
      # Upgrades user membership to premium
      def upgrade
        # Ensure users can only upgrade their own account
        unless params[:id].to_i == current_user.id
          render_error(
            message: "Unauthorized. You can only upgrade your own account.",
            status: :forbidden
          )
          return
        end

        # Check if already premium
        if current_user.premium?
          render_error(
            message: "Account is already Premium.",
            status: :unprocessable_entity
          )
          return
        end

        if current_user.update(membership: 'premium')
          render_success(
            data: UserSerializer.new(current_user.reload).as_json,
            message: "Account upgraded to Premium successfully!"
          )
        else
          render_error(
            message: "Failed to upgrade account",
            errors: current_user.errors.to_hash,
            status: :unprocessable_entity
          )
        end
      end

      # PUT /api/v1/users/:id/change_password
      # Protected endpoint - requires authentication
      # Changes user password
      def change_password
        # Ensure users can only change their own password
        unless params[:id].to_i == current_user.id
          render_error(
            message: "Unauthorized. You can only change your own password.",
            status: :forbidden
          )
          return
        end

        # Validate current password
        unless current_user.authenticate(change_password_params[:current_password])
          render_error(
            message: "Current password is incorrect.",
            status: :unauthorized
          )
          return
        end

        # Validate new password
        if change_password_params[:new_password].blank?
          render_error(
            message: "New password cannot be blank.",
            status: :unprocessable_entity
          )
          return
        end

        if change_password_params[:new_password].length < 6
          render_error(
            message: "New password must be at least 6 characters.",
            status: :unprocessable_entity
          )
          return
        end

        if change_password_params[:new_password] != change_password_params[:new_password_confirmation]
          render_error(
            message: "New password and confirmation do not match.",
            status: :unprocessable_entity
          )
          return
        end

        # Update password
        if current_user.update(password: change_password_params[:new_password])
          render_success(
            message: "Password changed successfully!"
          )
        else
          render_error(
            message: "Failed to change password",
            errors: current_user.errors.to_hash,
            status: :unprocessable_entity
          )
        end
      end

      private

      def user_params
        params.require(:user).permit(:email, :password, :password_confirmation, :name, :language)
      end

      def login_params
        params.require(:user).permit(:email, :password)
      end

      def change_password_params
        params.require(:user).permit(:current_password, :new_password, :new_password_confirmation)
      end

      def json_request?
        request.format.json?
      end
    end
  end
end

