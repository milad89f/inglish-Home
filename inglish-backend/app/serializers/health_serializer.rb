class HealthSerializer < BaseSerializer
  def as_json(_options = {})
    {
      status: "ok",
      message: "Inglish Backend API is running",
      timestamp: Time.current.iso8601,
      version: "1.0.0"
    }
  end
end




