class VideoSerializer < BaseSerializer
  def as_json(options = {})
    data = {
      id: object.id,
      text: object.text,
      language: object.language,
      remote_video_url: object.remote_video_url,
      local_uri: object.local_uri,
      video_type: object.video_type,
      position: object.position,
      did_talk_id: object.did_talk_id,
      user_id: object.user_id,
      course_id: object.course_id,
      subject_id: object.subject_id,
      created_at: object.created_at.iso8601,
      updated_at: object.updated_at.iso8601,
      is_idle: object.is_idle?,
      is_success: object.is_success?,
      is_retry: object.is_retry?
    }

    if options[:include_user]
      data[:user] = UserSerializer.new(object.user).as_json
    end

    if options[:include_course]
      data[:course] = CourseSerializer.new(object.course).as_json
    end

    if options[:include_subject]
      data[:subject] = SubjectSerializer.new(object.subject).as_json if object.subject
    end

    if options[:include_reports_count]
      data[:reports_count] = object.reports.count
    end

    data
  end
end

