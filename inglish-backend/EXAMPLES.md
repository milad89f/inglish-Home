# Examples

This file contains practical examples of using the MVC architecture.

## Example: User CRUD with MVC Architecture

### 1. Model (`app/models/user.rb`)

```ruby
class User < ApplicationRecord
  validates :name, presence: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  
  has_secure_password
  
  scope :active, -> { where(active: true) }
end
```

### 2. Serializer (`app/serializers/user_serializer.rb`)

```ruby
class UserSerializer < BaseSerializer
  def as_json(_options = {})
    {
      id: object.id,
      name: object.name,
      email: object.email,
      created_at: object.created_at.iso8601,
      updated_at: object.updated_at.iso8601
    }
  end
end
```

### 3. Service (`app/services/create_user_service.rb`)

```ruby
class CreateUserService < BaseService
  def initialize(params)
    @params = params
  end

  def call
    user = User.new(@params)
    
    if user.save
      success(data: user)
    else
      error("Failed to create user", errors: user.errors.to_hash)
    end
  end

  private

  attr_reader :params
end
```

### 4. Controller (`app/controllers/api/v1/users_controller.rb`)

```ruby
module Api
  module V1
    class UsersController < BaseController
      def index
        users = User.active
        render_success(
          data: serialize_collection(users, serializer: UserSerializer)
        )
      end

      def show
        user = User.find(params[:id])
        render_success(data: UserSerializer.new(user).as_json)
      end

      def create
        result = CreateUserService.call(user_params)
        
        if result.success?
          render_success(
            data: UserSerializer.new(result.data).as_json,
            message: "User created successfully"
          )
        else
          render_error(
            message: result.message,
            errors: result.errors
          )
        end
      end

      def update
        user = User.find(params[:id])
        
        if user.update(user_params)
          render_success(
            data: UserSerializer.new(user).as_json,
            message: "User updated successfully"
          )
        else
          render_error(
            message: "Failed to update user",
            errors: user.errors.to_hash
          )
        end
      end

      def destroy
        user = User.find(params[:id])
        user.destroy
        render_success(message: "User deleted successfully")
      end

      private

      def user_params
        params.require(:user).permit(:name, :email, :password, :password_confirmation)
      end
    end
  end
end
```

### 5. Routes (`config/routes.rb`)

```ruby
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :users
    end
  end
end
```

## Example: Service with Complex Logic

```ruby
class SendWelcomeEmailService < BaseService
  def initialize(user)
    @user = user
  end

  def call
    return error("User is invalid") unless @user.valid?
    
    begin
      WelcomeMailer.send_email(@user).deliver_now
      success(message: "Welcome email sent successfully")
    rescue StandardError => e
      error("Failed to send email: #{e.message}")
    end
  end

  private

  attr_reader :user
end
```

## Example: Serializer with Associations

```ruby
class PostSerializer < BaseSerializer
  def as_json(_options = {})
    {
      id: object.id,
      title: object.title,
      content: object.content,
      author: UserSerializer.new(object.user).as_json,
      comments_count: object.comments.count,
      created_at: object.created_at.iso8601
    }
  end
end
```

## Example: Error Handling

```ruby
module Api
  module V1
    class PostsController < BaseController
      def create
        post = Post.new(post_params)
        
        if post.save
          render_success(
            data: PostSerializer.new(post).as_json,
            message: "Post created successfully"
          )
        else
          # Uses ApplicationController#render_error
          render_error(
            message: "Validation failed",
            errors: post.errors.to_hash
          )
        end
      rescue ActiveRecord::RecordInvalid => e
        # Handled by ApplicationController#render_unprocessable_entity
        raise e
      end
    end
  end
end
```




