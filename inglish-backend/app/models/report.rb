class Report < ApplicationRecord
  # Associations
  belongs_to :user
  belongs_to :video
  belongs_to :course

  # Validations
  validates :accuracy, presence: true, inclusion: { in: 0.0..100.0 }
  validates :reference_text, presence: true
  validates :user_id, presence: true
  validates :video_id, presence: true
  validates :course_id, presence: true

  # Scopes
  scope :perfect, -> { where(accuracy: 100.0) }
  scope :needs_retry, -> { where('accuracy < ?', 100.0) }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_accuracy_range, ->(min, max) { where(accuracy: min..max) }

  # Accuracy levels
  PERFECT_THRESHOLD = 100.0
  GOOD_THRESHOLD = 80.0
  NEEDS_PRACTICE_THRESHOLD = 60.0

  def perfect?
    accuracy >= PERFECT_THRESHOLD
  end

  def good?
    accuracy >= GOOD_THRESHOLD && accuracy < PERFECT_THRESHOLD
  end

  def needs_practice?
    accuracy < NEEDS_PRACTICE_THRESHOLD
  end

  def accuracy_level
    return 'perfect' if perfect?
    return 'good' if good?
    return 'needs_practice' if needs_practice?
    'poor'
  end

  # Store incorrect words as JSONB
  def incorrect_words_array
    incorrect_words || []
  end

  # Store word details as JSONB
  def word_details_array
    word_details || []
  end
end

