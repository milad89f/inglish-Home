class AddMembershipToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :membership, :string, default: 'free', null: false
    add_index :users, :membership
  end
end

