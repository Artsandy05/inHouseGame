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
  */


const canAccessGame = (role: any, reply:any) => {
    const { ROLES } = require("../../constants/permission");

    const ROLES_GAME = [
        ROLES.SUPERADMIN.name,
        ROLES.MODERATOR.name,
        ROLES.PLAYER.name,
        ROLES.HOST.name,
        ROLES.CSR.name,
        ROLES.AUDITOR.name,
    ];
  
    if (!ROLES_GAME.includes(role)) {
        reply.code(401).send({ message: 'Forbidden: You cannot access this route' });
        return;
    }
};

const canAccessAdmin = (role: any, reply:any) => {
    const { ROLES } = require("../../constants/permission");

    const ROLES_ADMIN = [
        ROLES.SUPERADMIN.name,
        ROLES.ADMINISTRATOR.name,
        ROLES.SUPERAGENT.name,
        ROLES.MASTERAGENT.name,
        ROLES.AGENT.name,
        ROLES.OPERATOR.name,
        ROLES.VERIFIER.name,
        ROLES.SUPERVISOR.name,
        ROLES.ACCOUNTING.name,
        ROLES.AUDITOR.name,
        ROLES.TREASURY.name,
        ROLES.CASHIER.name,
      ];
      
      if (!ROLES_ADMIN.includes(role)) {
        reply.code(401).send({ message: 'Forbidden: You cannot access this route' });
        return;
      }
};
  
  export { canAccessGame, canAccessAdmin };
  