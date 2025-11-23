module Api
  module V1
    class LlmController < BaseController
      include PremiumMembership

      # POST /api/v1/llm/analysis
      # Protected endpoint - requires authentication and premium membership
      def generate_analysis
        require_premium_membership!
        
        result = LlmService.generate_analysis(
          user_id: current_user.id,
          report_data: analysis_params[:report_data] || {}
        )

        if result.success?
          render_success(
            data: result.data,
            message: "Analysis generated successfully"
          )
        else
          render_error(
            message: result.message,
            errors: result.errors,
            status: :unprocessable_entity
          )
        end
      end

      # POST /api/v1/llm/report
      # Protected endpoint - requires authentication and premium membership
      def generate_report
        require_premium_membership!
        
        result = LlmService.generate_report(
          user_id: current_user.id,
          course_id: report_params[:course_id],
          performance_metrics: report_params[:performance_metrics] || {}
        )

        if result.success?
          render_success(
            data: result.data,
            message: "Report generated successfully"
          )
        else
          render_error(
            message: result.message,
            errors: result.errors,
            status: :unprocessable_entity
          )
        end
      end

      # POST /api/v1/llm/subject
      # Protected endpoint - requires authentication and premium membership
      def generate_subject
        require_premium_membership!
        
        result = LlmService.generate_subject(
          course_id: subject_params[:course_id],
          subject_params: subject_params.except(:course_id)
        )

        if result.success?
          render_success(
            data: result.data,
            message: "Subject generated successfully"
          )
        else
          render_error(
            message: result.message,
            errors: result.errors,
            status: :unprocessable_entity
          )
        end
      end

      # POST /api/v1/llm/sentences
      # Protected endpoint - requires authentication and premium membership
      def generate_sentences
        require_premium_membership!
        
        result = LlmService.generate_sentences(
          course_id: sentences_params[:course_id],
          sentence_params: sentences_params.except(:course_id)
        )

        if result.success?
          render_success(
            data: result.data,
            message: "Practice sentences generated successfully"
          )
        else
          render_error(
            message: result.message,
            errors: result.errors,
            status: :unprocessable_entity
          )
        end
      end

      private

      def analysis_params
        # Accept report_data directly or from llm wrapper
        if params[:llm].present?
          params.require(:llm).permit(report_data: {})
        else
          params.permit(report_data: {})
        end
      end

      def report_params
        params.require(:llm).permit(:course_id, performance_metrics: {})
      end

      def subject_params
        params.require(:llm).permit(:course_id, :name, :difficulty, :language)
      end

      def sentences_params
        params.require(:llm).permit(:course_id, :topic, :level, :count, :language)
      end

      def json_request?
        request.format.json?
      end
    end
  end
end

