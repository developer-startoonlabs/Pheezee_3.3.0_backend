const findRange = (bodypart, exercisename)=> {
    
            console.log(bodypart,exercisename);
          if(bodypart==='Knee'){
              if(exercisename==='Flexion'){
                return {range:"140"}
              }else if(exercisename==='Extension'){
                return {range:"140"}
              }else if(exercisename==='Isometric'){
                return {range:"10"}
              }
              else{
                return {range:"150"}
              }
          }else if(bodypart==='Shoulder'){
              if(exercisename==='Flexion'){
                return {range:"180"}
              }else if(exercisename==='Extension'){
                return {range:"45"}
              }else if(exercisename==='Abduction'){
                return {range:"180"}
              }else if(exercisename==='Adduction'){
                return {range:"180"}
              }
              /*if(exercisename==='Protraction'){
                return {range:"30"}
              }else if(exercisename==='Retraction'){
                return {range:"30"}
              }else if(exercisename==='Elevation'){
                return {range:"30"}
              }else if(exercisename==='Depression'){
                return {range:"30"}
              }*/
              else if(exercisename==='Medial Rotation'){
                return {range:"70"}
              }else if(exercisename==='Lateral Rotation'){
                return {range:"90"}
              }
              else if(exercisename==='Isometric'){
                return {range:"10"}
              }
              else{
                return {range:"180"}
              }
          }else if(bodypart==='Ankle'){
            if(exercisename==='Dorsiflexion'){
              return {range:"20"}
              }else if(exercisename==='Plantarflexion'){
                return {range:"45"}
              }else if(exercisename==='Inversion'){
                return {range:"40"}
              }else if(exercisename==='Eversion'){
                return {range:"20"}
              }else if(exercisename==='Isometric'){
                return {range:"10"}
              }
              else{
                return {range:"50"}
              }
            
          }
          else if(bodypart==='Wrist'){
              if(exercisename==='Flexion'){
                return {range:"80"}
              }else if(exercisename==='Extension'){
                return {range:"70"}
              }else if(exercisename==='Radial deviation'){
                return {range:"20"}
              }else if(exercisename==='Ulnar deviation'){
                return {range:"20"}
              }else if(exercisename==='Isometric'){
                return {range:"10"}
              }
              else{
                return {range:"90"}
              }
          }else if(bodypart==='Elbow'){
              if(exercisename==='Flexion'){
                return {range:"145"}
              }else if(exercisename==='Extension'){
                return {range:"145"}
              }else if(exercisename==='Isometric'){
                return {range:"10"}
              }
              /*else if(exercisename==='Medial Rotation'){
                return {range:"70"}
              }else if(exercisename==='Lateral Rotation'){
                return {range:"70"}
              }else if(exercisename==='Pronation'){
                return {range:"90"}
              }else if(exercisename==='Supination'){
                return {range:"90"}
              }*/
              else{
                return {range:"160"}
              }
          }else if(bodypart==='Hip'){
              if(exercisename==='Flexion'){
                return {range:"125"}
              }else if(exercisename==='Extension'){
                return {range:"10"}
              }else if(exercisename==='Abduction'){
                return {range:"45"}
              }else if(exercisename==='Adduction'){
                return {range:"10"}
              }else if(exercisename==='Medial Rotation'){
                return {range:"45"}
              }else if(exercisename==='Lateral Rotation'){
                return {range:"45"}
              }else if(exercisename==='Isometric'){
                return {range:"10"}
              }
              else{
                return {range:"125"}
              }
          }else if(bodypart==='Forearm'){
            if(exercisename==='Supination'){
                return {range:"90"}
              }else if(exercisename==='Pronation'){
                return {range:"90"}
              }else if(exercisename==='Isometric'){
                return {range:"10"}
              }else{
                return {range:"30"}
              } 
          }else if(bodypart==='Spine'){
            if(exercisename==='Flexion'){
                return {range:"75"}
              }else if(exercisename==='Extension'){
                return {range:"30"}
              }else if(exercisename==='Lateral Flexion'){
                return {range:"35"}
              }else if(exercisename==='Rotation'){
                return {range:"30"}
              }else if(exercisename==='Isometric'){
                return {range:"10"}
              }else{
                return {range:"30"}
              } 
          }
          else if(bodypart==='Others'){
            return {range:"360"}
          }
};