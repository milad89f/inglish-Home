class SubjectSerializer < BaseSerializer
  def as_json(options = {})
    data = {
      id: object.id,
      name: object.name,
      description: object.description,
      language: object.language,
      difficulty: object.difficulty,
      difficulty_label: object.difficulty_label,
      position: object.position,
      created_at: object.created_at.iso8601,
      updated_at: object.updated_at.iso8601
    }

    if options[:include_course]
      data[:course] = CourseSerializer.new(object.course).as_json
    end

    if options[:include_videos]
      data[:videos] = object.videos.map { |v| VideoSerializer.new(v).as_json }
    end

    data
  end
end




