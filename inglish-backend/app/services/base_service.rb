# Base service class following the Service Object pattern
# All services should inherit from this class
class BaseService
  def self.call(*args, **kwargs, &block)
    new(*args, **kwargs).call(&block)
  end

  def call
    raise NotImplementedError, "Subclasses must implement #call"
  end

  protected

  def success(data = nil, message = nil, **kwargs)
    # Support both positional and keyword arguments
    # If data is passed as keyword argument, use it
    data = kwargs[:data] if kwargs.key?(:data) && data.nil?
    # If message is passed as keyword argument, use it
    message = kwargs[:message] if kwargs.key?(:message) && message.nil?
    ServiceResult.new(success: true, data: data, message: message)
  end

  def error(message, errors: {})
    ServiceResult.new(success: false, message: message, errors: errors)
  end
end

# Result object returned by services
class ServiceResult
  attr_reader :data, :message, :errors

  def initialize(success:, data: nil, message: nil, errors: {})
    @success = success
    @data = data
    @message = message
    @errors = errors
  end

  def success?
    @success
  end

  def failure?
    !@success
  end
end




