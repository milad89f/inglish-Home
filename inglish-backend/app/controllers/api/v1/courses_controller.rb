module Api
  module V1
    class CoursesController < BaseController
      include PremiumMembership
      
      # All endpoints are protected by authenticate_user! from Authenticable

      # POST /api/v1/courses
      # Protected endpoint - requires authentication
      # Free users can create one course, premium users can create unlimited
      def create
        # Check if free user already has a course
        unless current_user.premium?
          existing_courses_count = current_user.courses.count
          if existing_courses_count >= 1
            render_error(
              message: "Free users can only create one course. Please upgrade to premium to create more courses.",
              status: :forbidden
            )
            return
          end
        end
        
        # Ensure course belongs to current user
        course_params_with_user = course_params.merge(user_id: current_user.id)
        
        # If this is the first course, set it as default and active
        is_first_course = current_user.courses.count == 0
        course_params_with_user[:is_default] = is_first_course
        course_params_with_user[:is_active] = is_first_course
        
        course = Course.new(course_params_with_user)

        if course.save
          render_success(
            data: CourseSerializer.new(course).as_json,
            message: "Course created successfully",
            status: :created
          )
        else
          render_error(
            message: "Failed to create course",
            errors: course.errors.to_hash,
            status: :unprocessable_entity
          )
        end
      end

      # GET /api/v1/courses/:id
      # Protected endpoint - requires authentication
      def show
        course = Course.find(params[:id])
        
        # Ensure users can only access their own courses
        unless course.user_id == current_user.id
          render_error(
            message: "Unauthorized. You can only access your own courses.",
            status: :forbidden
          )
          return
        end

        render_success(
          data: CourseSerializer.new(course).as_json(include_user: true, include_subjects: true)
        )
      rescue ActiveRecord::RecordNotFound
        render_error(
          message: "Course not found",
          status: :not_found
        )
      end

      # GET /api/v1/courses/:id/videos
      # Protected endpoint - requires authentication
      def videos
        course = Course.find(params[:id])
        
        # Ensure users can only access their own courses
        unless course.user_id == current_user.id
          render_error(
            message: "Unauthorized. You can only access your own courses.",
            status: :forbidden
          )
          return
        end
        
        videos = course.videos.order(position: :asc, created_at: :asc)

        render_success(
          data: serialize_collection(videos, serializer: VideoSerializer)
        )
      rescue ActiveRecord::RecordNotFound
        render_error(
          message: "Course not found",
          status: :not_found
        )
      end

      # GET /api/v1/courses/:id/reports
      # Protected endpoint - requires authentication
      def reports
        course = Course.find(params[:id])
        
        # Ensure users can only access their own courses
        unless course.user_id == current_user.id
          render_error(
            message: "Unauthorized. You can only access your own courses.",
            status: :forbidden
          )
          return
        end
        
        reports = course.reports.order(created_at: :desc)

        render_success(
          data: serialize_collection(reports, serializer: ReportSerializer)
        )
      rescue ActiveRecord::RecordNotFound
        render_error(
          message: "Course not found",
          status: :not_found
        )
      end

      # GET /api/v1/courses/:id/subjects
      # Protected endpoint - requires authentication
      def subjects
        course = Course.find(params[:id])
        
        # Ensure users can only access their own courses
        unless course.user_id == current_user.id
          render_error(
            message: "Unauthorized. You can only access your own courses.",
            status: :forbidden
          )
          return
        end
        
        subjects = course.subjects.ordered

        render_success(
          data: serialize_collection(subjects, serializer: SubjectSerializer)
        )
      rescue ActiveRecord::RecordNotFound
        render_error(
          message: "Course not found",
          status: :not_found
        )
      end

      # PUT /api/v1/courses/:id/set_active
      # Protected endpoint - requires authentication
      # Sets a course as active (only one active course per user)
      def set_active
        course = current_user.courses.find(params[:id])
        
        # Set this course as active and deactivate others
        Course.transaction do
          current_user.courses.where.not(id: course.id).update_all(is_active: false)
          course.update!(is_active: true)
        end

        render_success(
          data: CourseSerializer.new(course.reload).as_json,
          message: "Course set as active successfully"
        )
      rescue ActiveRecord::RecordNotFound
        render_error(
          message: "Course not found or unauthorized",
          status: :not_found
        )
      end

      private

      def course_params
        # user_id is set automatically from current_user, not from params
        params.require(:course).permit(:title, :description, :language, :level, :is_published)
      end

      def json_request?
        request.format.json?
      end
    end
  end
end

