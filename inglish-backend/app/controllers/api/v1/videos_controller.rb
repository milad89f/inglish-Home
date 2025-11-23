module Api
  module V1
    class VideosController < BaseController
      # All endpoints are protected by authenticate_user! from Authenticable

      # POST /api/v1/courses/:course_id/videos
      # Create a new video for a course
      def create
        course = Course.find(params[:course_id])
        
        # Ensure users can only create videos for their own courses
        unless course.user_id == current_user.id
          render_error(
            message: "Unauthorized. You can only create videos for your own courses.",
            status: :forbidden
          )
          return
        end

        video_params_with_ids = video_params.merge(
          user_id: current_user.id,
          course_id: course.id
        )

        # Set default position if not provided
        unless video_params_with_ids[:position]
          max_position = course.videos.maximum(:position) || 0
          video_params_with_ids[:position] = max_position + 1
        end

        video = Video.new(video_params_with_ids)

        if video.save
          render_success(
            data: VideoSerializer.new(video).as_json,
            message: "Video created successfully",
            status: :created
          )
        else
          render_error(
            message: "Failed to create video",
            errors: video.errors.to_hash,
            status: :unprocessable_entity
          )
        end
      rescue ActiveRecord::RecordNotFound
        render_error(
          message: "Course not found",
          status: :not_found
        )
      end

      # PUT /api/v1/videos/:id
      # Update a video (video_type, position, etc.)
      def update
        video = Video.find(params[:id])
        
        # Ensure users can only update their own videos
        unless video.user_id == current_user.id
          render_error(
            message: "Unauthorized. You can only update your own videos.",
            status: :forbidden
          )
          return
        end

        if video.update(video_params)
          render_success(
            data: VideoSerializer.new(video).as_json,
            message: "Video updated successfully"
          )
        else
          render_error(
            message: "Failed to update video",
            errors: video.errors.to_hash,
            status: :unprocessable_entity
          )
        end
      rescue ActiveRecord::RecordNotFound
        render_error(
          message: "Video not found",
          status: :not_found
        )
      end

      # DELETE /api/v1/videos/:id
      # Delete a video
      def destroy
        video = Video.find(params[:id])
        
        # Ensure users can only delete their own videos
        unless video.user_id == current_user.id
          render_error(
            message: "Unauthorized. You can only delete your own videos.",
            status: :forbidden
          )
          return
        end

        if video.destroy
          render_success(
            message: "Video deleted successfully"
          )
        else
          render_error(
            message: "Failed to delete video",
            status: :unprocessable_entity
          )
        end
      rescue ActiveRecord::RecordNotFound
        render_error(
          message: "Video not found",
          status: :not_found
        )
      end

      # GET /api/v1/videos/:id
      # Get a specific video
      def show
        video = Video.find(params[:id])
        
        # Ensure users can only access their own videos
        unless video.user_id == current_user.id
          render_error(
            message: "Unauthorized. You can only access your own videos.",
            status: :forbidden
          )
          return
        end

        render_success(
          data: VideoSerializer.new(video).as_json(include_course: true, include_reports_count: true)
        )
      rescue ActiveRecord::RecordNotFound
        render_error(
          message: "Video not found",
          status: :not_found
        )
      end

      private

      def video_params
        params.require(:video).permit(:text, :language, :remote_video_url, :local_uri, :video_type, :position, :did_talk_id, :subject_id)
      end
    end
  end
end

