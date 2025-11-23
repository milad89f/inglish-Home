class AddIsDefaultAndIsActiveToCourses < ActiveRecord::Migration[8.1]
  def change
    add_column :courses, :is_default, :boolean, default: false, null: false
    add_column :courses, :is_active, :boolean, default: false, null: false
    
    # Set first course of each user as default and active if they have courses
    execute <<-SQL
      UPDATE courses
      SET is_default = true, is_active = true
      WHERE id IN (
        SELECT MIN(id)
        FROM courses
        GROUP BY user_id
      );
    SQL
    
    # Add indexes for better query performance
    add_index :courses, :is_default
    add_index :courses, :is_active
    add_index :courses, [:user_id, :is_active]
  end
end
