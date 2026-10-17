import { Schema, model } from 'mongoose';
const empleadoSchema=new Schema({

 nombre:{type:String, required:true, trim:true, minlength:2, maxlength:100},
 cargo:{type:String, required: true, trim:true, minlength:2, maxlength:100},
 departamento:{type:String, required:true, trim:true, minlength:2, maxlength:100},
 sueldo:{type:Number, required:true, min:0}
}, {
     timestamps:true,
 versionKey:false
})
export default model("Empleado",empleadoSchema);
