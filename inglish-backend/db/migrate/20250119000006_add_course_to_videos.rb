class AddCourseToVideos < ActiveRecord::Migration[8.1]
  def change
    # course_id already exists in CreateVideos migration, skip if exists
    unless column_exists?(:videos, :course_id)
      add_reference :videos, :course, null: true, foreign_key: true, index: true
    end
  end
end




