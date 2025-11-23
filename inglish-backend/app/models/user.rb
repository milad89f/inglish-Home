class User < ApplicationRecord
  # Authentication
  has_secure_password

  # Associations
  has_many :courses, dependent: :destroy
  has_many :videos, dependent: :destroy
  has_many :reports, dependent: :destroy

  # Enums
  enum :membership, {
    free: 'free',
    premium: 'premium'
  }

  # Validations
  validates :email, presence: true, uniqueness: { case_sensitive: false }, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true
  validates :language, presence: true, inclusion: { in: %w[en tr] }
  validates :password, length: { minimum: 6 }, if: -> { new_record? || !password.nil? }
  validates :membership, presence: true, inclusion: { in: memberships.keys }

  # Scopes
  scope :by_language, ->(lang) { where(language: lang) }
  scope :premium_users, -> { where(membership: 'premium') }
  scope :free_users, -> { where(membership: 'free') }

  # Set default membership before validation
  before_validation :set_default_membership, on: :create
  
  # Normalize email before saving
  before_save :normalize_email

  # Check if user has premium membership
  def premium?
    membership == 'premium'
  end

  # Check if user has free membership
  def free?
    membership == 'free'
  end

  private

  def set_default_membership
    self.membership ||= 'free'
  end

  def normalize_email
    self.email = email.downcase if email.present?
  end
end

