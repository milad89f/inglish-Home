class AddCourseToReports < ActiveRecord::Migration[8.1]
  def change
    # course_id already exists in CreateReports migration, skip if exists
    unless column_exists?(:reports, :course_id)
      add_reference :reports, :course, null: true, foreign_key: true, index: true
    end
  end
end




