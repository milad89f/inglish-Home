class CreateReports < ActiveRecord::Migration[8.1]
  def change
    create_table :reports do |t|
      t.references :user, null: false, foreign_key: true, index: true
      t.references :video, null: false, foreign_key: true, index: true
      t.references :course, null: false, foreign_key: true, index: true
      t.decimal :accuracy, precision: 5, scale: 2, null: false # 0.00 to 100.00
      t.text :reference_text, null: false
      t.text :transcribed_text
      t.json :incorrect_words, default: [] # Array of incorrect word data
      t.json :word_details, default: [] # Array of word objects with isCorrect, confidence
      t.integer :audio_duration # Duration in seconds

      t.timestamps
    end

    add_index :reports, [:user_id, :created_at]
    add_index :reports, [:video_id, :created_at]
    add_index :reports, [:course_id, :created_at]
    add_index :reports, :accuracy
  end
end

