class JwtService < BaseService
  SECRET_KEY = Rails.application.credentials.secret_key_base || Rails.application.secret_key_base

  # Encode payload to JWT token
  def self.encode(payload, exp = 24.hours.from_now)
    payload[:exp] = exp.to_i
    JWT.encode(payload, SECRET_KEY)
  end

  # Decode JWT token to payload
  def self.decode(token)
    decoded = JWT.decode(token, SECRET_KEY)[0]
    HashWithIndifferentAccess.new(decoded)
  rescue JWT::DecodeError => e
    nil
  rescue JWT::ExpiredSignature => e
    nil
  end

  # Generate token for user
  def self.token_for(user)
    encode(
      {
        user_id: user.id,
        email: user.email,
        iat: Time.current.to_i
      }
    )
  end

  # Get current user from token
  def self.current_user(token)
    return nil unless token

    decoded = decode(token)
    return nil unless decoded

    User.find_by(id: decoded[:user_id])
  end
end




