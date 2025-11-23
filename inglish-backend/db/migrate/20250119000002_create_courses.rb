class CreateCourses < ActiveRecord::Migration[8.1]
  def change
    create_table :courses do |t|
      t.references :user, null: false, foreign_key: true, index: true
      t.string :title, null: false, index: true
      t.text :description
      t.string :language, null: false
      t.string :level # beginner, intermediate, advanced
      t.boolean :is_published, default: false

      t.timestamps
    end

    add_index :courses, [:user_id, :language]
  end
end




