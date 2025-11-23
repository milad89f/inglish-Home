class AuthenticationService < BaseService
  def initialize(email:, password:)
    @email = email
    @password = password
  end

  def call
    user = User.find_by(email: @email&.downcase)

    if user&.authenticate(@password)
      success(user, "Login successful")
    else
      error("Invalid email or password")
    end
  end
end




