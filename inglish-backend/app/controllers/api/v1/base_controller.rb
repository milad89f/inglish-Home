module Api
  module V1
    class BaseController < ApplicationController
      include Authenticable

      # Base controller for all API v1 endpoints
      # All v1 controllers should inherit from this

      # Common helper methods for API v1
      protected

      def serialize(object, serializer: nil, **options)
        if serializer
          serializer.new(object).as_json(**options)
        elsif object.respond_to?(:to_json)
          object.as_json(**options)
        else
          object
        end
      end

      def serialize_collection(collection, serializer: nil, **options)
        collection.map { |item| serialize(item, serializer: serializer, **options) }
      end
    end
  end
end

