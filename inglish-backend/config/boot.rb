ENV["BUNDLE_GEMFILE"] ||= File.expand_path("../Gemfile", __dir__)

require "bundler/setup" # Set up gems listed in the Gemfile.

# Fix for Windows: Add tzinfo-data to load path manually
if Gem.win_platform?
  begin
    # Find tzinfo-data gem path
    tzinfo_data_gem = Gem.find_files("tzinfo/data").first
    if tzinfo_data_gem
      $LOAD_PATH.unshift(File.dirname(tzinfo_data_gem))
    end
    # Try to require from user gems
    gem_path = File.join(Gem.user_dir, "gems", "tzinfo-data-1.2025.2", "lib")
    if File.exist?(gem_path)
      $LOAD_PATH.unshift(gem_path)
    end
    require "tzinfo/data"
  rescue LoadError
    # If tzinfo-data is not available, set timezone to UTC
    ENV["TZ"] = "UTC"
  end
end

require "bootsnap/setup" # Speed up boot time by caching expensive operations.
