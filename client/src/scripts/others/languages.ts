import { TranslationManager } from "common/scripts/engine/definitions.ts";

export async function NewMDLanguageManager(default_language:string,path:string):Promise<TranslationManager>{
    const lang=await(await fetch(`${path}/${default_language}.json`)).json()
    const lm=new TranslationManager(lang)
    return lm
}