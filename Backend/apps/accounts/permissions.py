from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """
    Allows access only to Admin users.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'ADMIN'
        )


class IsGateMan(permissions.BasePermission):
    """
    Allows access only to Gate Man users.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'GATE_MAN'
        )


class IsStudent(permissions.BasePermission):
    """
    Allows access only to Student users.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'STUDENT'
        )


class IsAdminOrGateMan(permissions.BasePermission):
    """
    Allows access to Admin or Gate Man users.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['ADMIN', 'GATE_MAN']
        )
