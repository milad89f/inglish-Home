class CourseSerializer < BaseSerializer
  def as_json(options = {})
    data = {
      id: object.id,
      title: object.title,
      description: object.description,
      language: object.language,
      level: object.level,
      is_published: object.is_published,
      is_default: object.is_default || false,
      is_active: object.is_active || false,
      user_id: object.user_id,
      created_at: object.created_at.iso8601,
      updated_at: object.updated_at.iso8601,
      # Statistics - always include
      videos_count: object.videos.count,
      reports_count: object.reports.count,
      subjects_count: object.subjects.count
    }

    if options[:include_user]
      data[:user] = UserSerializer.new(object.user).as_json
    end

    if options[:include_subjects]
      data[:subjects] = object.subjects.ordered.map { |s| SubjectSerializer.new(s).as_json }
    end

    data
  end
end

