"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, X, UserPlus, Loader2 } from "lucide-react";
import { userService } from "@/lib/services/user-service";
import { User } from "@/lib/models/users";
import { toast } from "sonner";

export interface ProjectMember {
  user_id: string;
  user: {
    id: string;
    full_name: string;
    avatar: string | null;
  };
  role: string;
}

interface UserSearchSelectorProps {
  label?: string;
  selectedMembers: ProjectMember[];
  onChange: (members: ProjectMember[]) => void;
  maxMembers?: number;
  placeholder?: string;
  excludeUserIds?: string[];
}

export function UserSearchSelector({
  label = "Team Members",
  selectedMembers,
  onChange,
  maxMembers = 10,
  placeholder = "Search for users...",
  excludeUserIds = [],
}: UserSearchSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleInput, setRoleInput] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Search users when query changes
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const users = await userService.getUsers({ search: searchQuery });

        // Filter out already selected users and excluded users
        const filteredUsers = users.filter(
          (user) =>
            !selectedMembers.some((member) => member.user_id === user.id) &&
            !excludeUserIds.includes(user.id)
        );

        setSearchResults(filteredUsers);
        setShowResults(true);
      } catch (error) {
        console.error("Error searching users:", error);
        toast.error("Failed to search users");
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedMembers, excludeUserIds]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setRoleInput("");
    setShowResults(false);
    setSearchQuery("");
  };

  const handleAddMember = () => {
    if (!selectedUser || !roleInput.trim()) {
      toast.error("Please select a user and enter a role");
      return;
    }

    if (selectedMembers.length >= maxMembers) {
      toast.error(`Maximum ${maxMembers} members allowed`);
      return;
    }

    const newMember: ProjectMember = {
      user_id: selectedUser.id,
      user: {
        id: selectedUser.id,
        full_name: selectedUser.full_name,
        avatar: selectedUser.avatar,
      },
      role: roleInput.trim(),
    };

    onChange([...selectedMembers, newMember]);
    setSelectedUser(null);
    setRoleInput("");
  };

  const handleRemoveMember = (userId: string) => {
    onChange(selectedMembers.filter((member) => member.user_id !== userId));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && selectedUser && roleInput.trim()) {
      e.preventDefault();
      handleAddMember();
    }
  };

  return (
    <div className="space-y-4">
      {/* Selected Members Display */}
      {selectedMembers.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Selected Members:</Label>
          <div className="space-y-2">
            {selectedMembers.map((member) => (
              <Card key={member.user_id} className="p-3">
                <CardContent className="p-0 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.user.avatar || ""} />
                      <AvatarFallback>
                        {member.user.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {member.user.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Role: {member.role}
                      </p>
                    </div>
                  </div>
                  {!excludeUserIds.includes(member.user_id) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Search and Add Section */}
      {selectedMembers.length < maxMembers && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              onFocus={() => setShowResults(true)}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
            )}
          </div>

          {/* Search Results */}
          {showResults && searchResults.length > 0 && (
            <Card className="max-h-60 overflow-y-auto">
              <CardContent className="p-0">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    className="w-full p-3 text-left hover:bg-muted/50 flex items-center space-x-3 border-b last:border-b-0"
                    onClick={() => handleUserSelect(user)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || ""} />
                      <AvatarFallback>
                        {user.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                      {user.skills && user.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {user.skills.slice(0, 3).map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {user.skills.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{user.skills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Role Input for Selected User */}
          {selectedUser && (
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedUser.avatar || ""} />
                  <AvatarFallback>
                    {selectedUser.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {selectedUser.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedUser.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex space-x-2">
                <Input
                  placeholder="Enter role (e.g., Developer, Designer, Manager)"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddMember}
                  disabled={!roleInput.trim()}
                  size="sm"
                >
                  Add
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedMembers.length >= maxMembers && (
        <p className="text-sm text-muted-foreground">
          Maximum {maxMembers} members reached
        </p>
      )}
    </div>
  );
}
