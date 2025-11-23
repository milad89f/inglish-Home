class Course < ApplicationRecord
  # Associations
  belongs_to :user
  has_many :subjects, dependent: :destroy
  has_many :videos, dependent: :destroy
  has_many :reports, dependent: :destroy
  # Videos through subjects (for subject-specific videos)
  has_many :subject_videos, through: :subjects, source: :videos

  # Validations
  validates :title, presence: true
  validates :language, presence: true, inclusion: { in: %w[en tr] }
  validates :user_id, presence: true
  validates :level, inclusion: { in: %w[beginner intermediate advanced] }, allow_nil: true

  # Scopes
  scope :published, -> { where(is_published: true) }
  scope :by_language, ->(lang) { where(language: lang) }
  scope :by_level, ->(level) { where(level: level) }
  scope :default_course, -> { where(is_default: true) }
  scope :active_course, -> { where(is_active: true) }
  scope :ordered, -> { order(is_active: :desc, created_at: :desc) }

  # Callbacks
  before_save :ensure_single_default, if: :is_default_changed?
  before_save :ensure_single_active, if: :is_active_changed?

  # Instance methods
  def videos_count
    videos.count
  end

  def reports_count
    reports.count
  end

  def subjects_count
    subjects.count
  end

  private

  # Ensure only one default course per user
  def ensure_single_default
    if is_default? && is_default_changed?
      user.courses.where.not(id: id).update_all(is_default: false)
    end
  end

  # Ensure only one active course per user
  def ensure_single_active
    if is_active? && is_active_changed?
      user.courses.where.not(id: id).update_all(is_active: false)
    end
  end
end

