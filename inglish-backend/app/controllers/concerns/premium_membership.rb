module PremiumMembership
  extend ActiveSupport::Concern

  included do
    # This concern should be included after Authenticable
    # to ensure current_user is available
  end

  private

  # Check if current user has premium membership
  # Returns error response if user is not premium
  def require_premium_membership!
    unless current_user&.premium?
      render_error(
        message: "This feature requires a premium membership. Please upgrade to access this endpoint.",
        status: :forbidden
      )
    end
  end

  # Check if user has premium membership (returns boolean)
  def premium_user?
    current_user&.premium? || false
  end
end

