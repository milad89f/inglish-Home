class Subject < ApplicationRecord
  # Associations
  belongs_to :course
  has_many :videos, dependent: :destroy

  # Validations
  validates :name, presence: true
  validates :language, presence: true, inclusion: { in: %w[en tr] }
  validates :difficulty, inclusion: { in: 1..3 }
  validates :course_id, presence: true

  # Scopes
  scope :by_difficulty, ->(diff) { where(difficulty: diff) }
  scope :ordered, -> { order(position: :asc) }
  scope :easy, -> { where(difficulty: 1) }
  scope :medium, -> { where(difficulty: 2) }
  scope :hard, -> { where(difficulty: 3) }

  # Difficulty labels
  DIFFICULTY_LABELS = {
    1 => 'Easy',
    2 => 'Medium',
    3 => 'Hard'
  }.freeze

  def difficulty_label
    DIFFICULTY_LABELS[difficulty] || 'Unknown'
  end
end




