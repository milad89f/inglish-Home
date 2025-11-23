class Video < ApplicationRecord
  # Associations
  belongs_to :user
  belongs_to :course
  belongs_to :subject, optional: true
  has_many :reports, dependent: :destroy

  # Validations
  validates :text, presence: true
  validates :language, presence: true, inclusion: { in: %w[en tr] }
  validates :remote_video_url, presence: true
  validates :video_type, inclusion: { in: %w[normal idle success retry] }
  validates :user_id, presence: true
  validates :course_id, presence: true

  # Scopes
  scope :by_language, ->(lang) { where(language: lang) }
  scope :by_type, ->(type) { where(video_type: type) }
  scope :ordered, -> { order(position: :asc) }
  scope :idle_videos, -> { where(video_type: 'idle') }
  scope :success_videos, -> { where(video_type: 'success') }
  scope :retry_videos, -> { where(video_type: 'retry') }

  # Video types
  VIDEO_TYPES = {
    normal: 'normal',
    idle: 'idle',
    success: 'success',
    retry: 'retry'
  }.freeze

  def is_idle?
    video_type == 'idle'
  end

  def is_success?
    video_type == 'success'
  end

  def is_retry?
    video_type == 'retry'
  end
end

