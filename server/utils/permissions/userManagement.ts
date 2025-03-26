const canViewTableUM = (role: any) => {
  const { ROLES } = require("../../constants/permission");

  /* ALL ROLES
    superadmin
    admin
    verifier
    supervisor
    masteragent
    agent
    operator
    moderator
    accounting
    player
    host
    csr
    auditor
    cashier
    host_monitoring
    treasury
*/

  switch (role) {
    case ROLES.SUPERADMIN.name:
      return [];
    case ROLES.ADMINISTRATOR.name:
      return [];
    case ROLES.SUPERVISOR.name: // THIS SUPERVISOR CANNOT VIEW ALL THE ROLES IN THE TABLE
      return [
        "supervisor",
        "superadmin",
        "verifier",
        "admin",
        "moderator",
        "accounting",
        "superagent",
        "masteragent",
        "agent",
        "operator",
        "host",
        "csr",
        "auditor",
        "cashier",
        "host_monitoring",
        "treasury"
    ];
    case ROLES.VERIFIER.name:
      return [
        "supervisor",
        "verifier",
        "superadmin",
        "admin",
        "moderator",
        "accounting",
        "superagent",
        "masteragent",
        "agent",
        "operator",
        "host",
        "csr",
        "auditor",
        "cashier",
        "host_monitoring",
        "treasury"
      ];
    case ROLES.OPERATOR.name:
      return [
        "supervisor",
        "verifier",
        "superadmin",
        "moderator",
        "superagent",
        "accounting",
        "operator",
        "player",
        "host",
        "csr",
        "auditor",
        "cashier"
      ];
    case ROLES.MASTERAGENT.name:
      return [
        "supervisor",
        "superadmin",
        "verifier",
        "admin",
        "moderator",
        "accounting",
        "superagent",
        "masteragent",
        "player",
        "host",
        "csr",
        "auditor",
        "cashier",
        "host_monitoring",
        "treasury"
      ];
    case ROLES.AGENT.name:
      return [];
    case ROLES.MODERATOR.name:
      return [];
    case ROLES.ACCOUNTING.name:
      return [];
    default:
      return [];
  }
};

export { canViewTableUM };
