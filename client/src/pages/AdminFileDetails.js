const fetchComments = async () => {
  try {
    console.log("Vérification de nouveaux commentaires...");
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token')
      }
    };
    
    const res = await axios.get(`/api/ecu-files/${id}`, config);
    
    if (res.data && res.data.discussionComments && res.data.discussionComments.length > 0) {
      // Forcer la mise à jour complète lors du premier chargement
      const shouldRefreshAll = comments.length === 0;
      
      // Vérifier si nous avons de nouveaux commentaires
      const currentCommentsIds = comments.map(c => c.id);
      const hasNewComments = res.data.discussionComments.some(c => !currentCommentsIds.includes(c._id));
      
      // Ne formater que si nous avons de nouveaux commentaires ou si c'est le premier chargement
      if (hasNewComments || shouldRefreshAll) {
        console.log("Nouveaux commentaires détectés ou premier chargement, mise à jour de l'affichage");
        
        const formattedComments = res.data.discussionComments.map(comment => {
          // Si ce commentaire existe déjà et qu'on ne fait pas un rafraîchissement complet
          const existingComment = comments.find(c => c.id === comment._id);
          if (existingComment && !existingComment.temporary && !shouldRefreshAll) {
            return existingComment;
          }
          
          // Définir le nom d'utilisateur et les drapeaux
          let userName = 'Utilisateur';
          let isAdmin = false;
          
          // Vérifier si le commentaire appartient à l'administrateur actuel
          const isCurrentAdmin = comment.user === user?._id;
          
          if (isCurrentAdmin) {
            userName = 'Vous';
            isAdmin = true;
          } else {
            // Si ce n'est pas l'admin actuel, vérifier si c'est un autre admin
            if (res.data.adminId === comment.user || 
                (res.data.adminIds && res.data.adminIds.includes(comment.user)) || 
                comment.admin) {
              userName = 'Administrateur';
              isAdmin = true;
            } else if (comment.expert) {
              userName = 'Expert technique';
            }
          }
          
          return {
            id: comment._id,
            user: userName,
            text: comment.text,
            date: comment.createdAt,
            isCurrentUser: isCurrentAdmin,
            isAdmin: isAdmin
          };
        });
        
        setComments(formattedComments);
      }
    }
  } catch (err) {
    console.error('Erreur lors de la vérification des commentaires:', err);
  }
}; 