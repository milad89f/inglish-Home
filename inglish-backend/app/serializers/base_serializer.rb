# Base serializer class for all serializers
# Provides common functionality for JSON serialization
class BaseSerializer
  def initialize(object)
    @object = object
  end

  def self.call(object, options = {})
    new(object).as_json(options)
  end

  def as_json(_options = {})
    raise NotImplementedError, "Subclasses must implement #as_json"
  end

  private

  attr_reader :object
end




