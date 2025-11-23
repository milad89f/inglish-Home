module Api
  module V1
    class ReportsController < BaseController
      # All endpoints are protected by authenticate_user! from Authenticable

      # POST /api/v1/courses/:course_id/videos/:video_id/reports
      # Create a new report for a video
      def create
        course = Course.find(params[:course_id])
        video = Video.find(params[:video_id])
        
        # Ensure users can only create reports for their own videos
        unless video.user_id == current_user.id && course.user_id == current_user.id
          render_error(
            message: "Unauthorized. You can only create reports for your own videos.",
            status: :forbidden
          )
          return
        end

        # Ensure video belongs to course
        unless video.course_id == course.id
          render_error(
            message: "Video does not belong to this course",
            status: :unprocessable_entity
          )
          return
        end

        report_params_with_ids = report_params.merge(
          user_id: current_user.id,
          video_id: video.id,
          course_id: course.id
        )

        report = Report.new(report_params_with_ids)

        if report.save
          render_success(
            data: ReportSerializer.new(report).as_json(include_video: true, include_course: true),
            message: "Report created successfully",
            status: :created
          )
        else
          render_error(
            message: "Failed to create report",
            errors: report.errors.to_hash,
            status: :unprocessable_entity
          )
        end
      rescue ActiveRecord::RecordNotFound => e
        render_error(
          message: "Course or Video not found",
          status: :not_found
        )
      end

      # GET /api/v1/reports/:id
      # Get a specific report
      def show
        report = Report.find(params[:id])
        
        # Ensure users can only access their own reports
        unless report.user_id == current_user.id
          render_error(
            message: "Unauthorized. You can only access your own reports.",
            status: :forbidden
          )
          return
        end

        render_success(
          data: ReportSerializer.new(report).as_json(include_video: true, include_course: true)
        )
      rescue ActiveRecord::RecordNotFound
        render_error(
          message: "Report not found",
          status: :not_found
        )
      end

      private

      def report_params
        params.require(:report).permit(
          :accuracy,
          :reference_text,
          :transcribed_text,
          :audio_duration,
          incorrect_words: [],
          word_details: []
        )
      end
    end
  end
end

