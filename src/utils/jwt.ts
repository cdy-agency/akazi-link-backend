import jwt from 'jsonwebtoken';

export const signToken = (payload: object) =>{
    return jwt.sign(payload, process.env.JWT_SECRET as string, {expiresIn: '7d'})
}

export const verifyToken =(token: string)=>{
    try {
        return jwt.verify(token, process.env.JWT_SECRET as string)
    } catch {
        return null
    }
}