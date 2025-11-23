class ReportSerializer < BaseSerializer
  def as_json(options = {})
    data = {
      id: object.id,
      accuracy: object.accuracy.to_f,
      reference_text: object.reference_text,
      transcribed_text: object.transcribed_text,
      incorrect_words: object.incorrect_words_array,
      word_details: object.word_details_array,
      audio_duration: object.audio_duration,
      accuracy_level: object.accuracy_level,
      perfect: object.perfect?,
      good: object.good?,
      needs_practice: object.needs_practice?,
      user_id: object.user_id,
      video_id: object.video_id,
      course_id: object.course_id,
      created_at: object.created_at.iso8601,
      updated_at: object.updated_at.iso8601
    }

    if options[:include_user]
      data[:user] = UserSerializer.new(object.user).as_json
    end

    if options[:include_video]
      data[:video] = VideoSerializer.new(object.video).as_json
    end

    if options[:include_course]
      data[:course] = CourseSerializer.new(object.course).as_json
    end

    data
  end
end

