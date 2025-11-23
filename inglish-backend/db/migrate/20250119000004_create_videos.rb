class CreateVideos < ActiveRecord::Migration[8.1]
  def change
    create_table :videos do |t|
      t.references :user, null: false, foreign_key: true, index: true
      t.references :course, null: false, foreign_key: true, index: true
      t.references :subject, null: true, foreign_key: true, index: true
      t.text :text, null: false
      t.string :language, null: false
      t.string :remote_video_url, null: false
      t.string :local_uri
      t.string :video_type, default: 'normal' # normal, idle, success, retry
      t.integer :position, default: 0
      t.string :did_talk_id # D-ID API talk ID

      t.timestamps
    end

    add_index :videos, [:user_id, :video_type]
    add_index :videos, [:user_id, :language]
    add_index :videos, [:course_id, :language]
    add_index :videos, [:subject_id, :position] if ActiveRecord::Base.connection.adapter_name == 'PostgreSQL'
  end
end

