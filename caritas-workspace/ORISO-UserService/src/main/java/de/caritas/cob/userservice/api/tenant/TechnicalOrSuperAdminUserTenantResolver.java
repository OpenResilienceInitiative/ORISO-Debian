package de.caritas.cob.userservice.api.tenant;

import static de.caritas.cob.userservice.api.config.auth.UserRole.TECHNICAL;
import static de.caritas.cob.userservice.api.config.auth.UserRole.TENANT_ADMIN;

import java.util.Arrays;
import java.util.Optional;
import java.util.Set;
import javax.servlet.http.HttpServletRequest;
import org.keycloak.adapters.springsecurity.token.KeycloakAuthenticationToken;
import org.keycloak.representations.AccessToken;
import org.springframework.stereotype.Component;

@Component
public class TechnicalOrSuperAdminUserTenantResolver implements TenantResolver {

  @Override
  public Optional<Long> resolve(HttpServletRequest request) {
    return isTechnicalOrGlobalTenantAdmin(request) ? Optional.of(0L) : Optional.empty();
  }

  private boolean isTechnicalOrGlobalTenantAdmin(HttpServletRequest request) {
    AccessToken token = getAccessToken(request);
    if (containsRole(token, TECHNICAL.getValue())) {
      return true;
    }
    return containsRole(token, TENANT_ADMIN.getValue()) && hasGlobalTenantScope(token);
  }

  private AccessToken getAccessToken(HttpServletRequest request) {
    return ((KeycloakAuthenticationToken) request.getUserPrincipal())
        .getAccount()
        .getKeycloakSecurityContext()
        .getToken();
  }

  private boolean containsRole(AccessToken token, String expectedRole) {
    if (hasRoles(token)) {
      Set<String> roles = token.getRealmAccess().getRoles();
      return roles.contains(expectedRole);
    } else {
      return false;
    }
  }

  private boolean hasGlobalTenantScope(AccessToken token) {
    Object tenantIdClaim = token.getOtherClaims().get("tenantId");
    if (tenantIdClaim == null) {
      return false;
    }
    if (tenantIdClaim instanceof Number) {
      return ((Number) tenantIdClaim).longValue() == 0L;
    }
    if (tenantIdClaim instanceof String) {
      try {
        return Long.parseLong((String) tenantIdClaim) == 0L;
      } catch (NumberFormatException e) {
        return false;
      }
    }
    return false;
  }

  private boolean hasRoles(AccessToken accessToken) {
    return accessToken.getRealmAccess() != null && accessToken.getRealmAccess().getRoles() != null;
  }

  @Override
  public boolean canResolve(HttpServletRequest request) {
    return resolve(request).isPresent();
  }
}
