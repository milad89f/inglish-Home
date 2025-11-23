class UserSerializer < BaseSerializer
  def as_json(options = {})
    data = {
      id: object.id,
      email: object.email,
      name: object.name,
      language: object.language,
      membership: object.membership,
      created_at: object.created_at.iso8601,
      updated_at: object.updated_at.iso8601
    }

    # Include courses if requested
    if options[:include_courses]
      data[:courses] = object.courses.map { |c| CourseSerializer.new(c).as_json }
    end

    data
  end
end

