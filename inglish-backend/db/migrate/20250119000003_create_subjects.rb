class CreateSubjects < ActiveRecord::Migration[8.1]
  def change
    create_table :subjects do |t|
      t.references :course, null: false, foreign_key: true, index: true
      t.string :name, null: false, index: true
      t.text :description
      t.string :language, null: false
      t.integer :difficulty, default: 1 # 1=Easy, 2=Medium, 3=Hard
      t.integer :position, default: 0

      t.timestamps
    end

    add_index :subjects, [:course_id, :name]
    add_index :subjects, [:course_id, :language]
  end
end




