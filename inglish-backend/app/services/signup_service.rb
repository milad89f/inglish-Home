class SignupService < BaseService
  def initialize(params)
    @params = params
  end

  def call
    # Set default membership if not provided
    params_with_defaults = @params.dup
    params_with_defaults[:membership] ||= 'free'
    
    user = User.new(params_with_defaults)

    if user.save
      success(user, "User created successfully")
    else
      error("Failed to create user", errors: user.errors.to_hash)
    end
  end
end




